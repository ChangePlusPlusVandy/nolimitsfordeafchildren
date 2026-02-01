/**
 * Container module to handle TypeDI ESM/CJS interop issues.
 * 
 * When importing TypeDI with ESM, the default import returns the module namespace
 * object, not the Container class. This module handles that and exports the actual
 * Container class.
 */
import "reflect-metadata";
import TypeDI from "typedi";

// Handle ESM/CJS interop - TypeDI default export may be the namespace or the class
const Container = (TypeDI as any).default || TypeDI;

export { Container };
export default Container;
