"use client";

import createCache, { type EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";

/**
 * Emotion cache provider for the App Router.
 *
 * Port of `AppRouterCacheProvider` from `@mui/material-nextjs`
 * (v13-appRouter/appRouterV13.mjs), owned here so the provider resolves
 * through the same module graph as every other client component. Importing
 * it from `@mui/material-nextjs` splits the Emotion runtime in dev
 * (provider raw, consumers bundled), so styled components miss the cache
 * key and hydration mismatches. This file lives in app source, so bundler
 * and dev server resolve one shared `@emotion/react`.
 *
 * App Router only: the Pages-Router misuse check from the original is
 * intentionally dropped (this app has no Pages Router).
 *
 * Upstream license notice (from @mui/material-nextjs/LICENSE, MIT):
 *
 * MIT License
 *
 * Copyright (c) 2014 Call-Em-All
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

interface CacheProviderProps {
  options?: Parameters<typeof createCache>[0] & {
    enableCssLayer?: boolean;
  };
  CacheProvider?: (props: { value: EmotionCache; children: ReactNode }) => React.JSX.Element;
  children: ReactNode;
}

export default function EmotionCacheProvider(props: CacheProviderProps) {
  const { options, CacheProvider: CacheProviderProp, children } = props;

  const [registry] = useState(() => {
    const cache = createCache({
      ...options,
      key: options?.key ?? "mui",
    });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: Array<{ name: string; isGlobal: boolean }> = [];
    // Override insert to support streaming SSR with flush().
    cache.insert = (...args) => {
      if (options?.enableCssLayer && !args[1].styles.match(/^@layer\s+[^{]*$/)) {
        args[1].styles = `@layer mui {${args[1].styles}}`;
      }
      const [selector, serialized] = args;
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push({
          name: serialized.name,
          isGlobal: !selector,
        });
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const inserted = registry.flush();
    if (inserted.length === 0) {
      return null;
    }
    let styles = "";
    let dataEmotionAttribute = registry.cache.key;
    const globals: Array<{ name: string; style: string }> = [];
    inserted.forEach(({ name, isGlobal }) => {
      const style = registry.cache.inserted[name];
      if (typeof style === "string") {
        if (isGlobal) {
          globals.push({ name, style });
        } else {
          styles += style;
          dataEmotionAttribute += ` ${name}`;
        }
      }
    });
    return (
      <>
        {globals.map(({ name, style }) => (
          <style
            key={name}
            nonce={options?.nonce}
            data-emotion={`${registry.cache.key}-global ${name}`}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: style }}
          />
        ))}
        {styles && (
          <style
            nonce={options?.nonce}
            data-emotion={dataEmotionAttribute}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: styles }}
          />
        )}
      </>
    );
  });

  const Provider = CacheProviderProp ?? CacheProvider;
  return <Provider value={registry.cache}>{children}</Provider>;
}
