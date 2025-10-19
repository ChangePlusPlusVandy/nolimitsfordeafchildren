import "reflect-metadata";
import { createExpressServer, useContainer } from "routing-controllers";
import express from "express";
import Container from "typedi";
import { ShowUserEndpoint } from "./domains/users/endpoints/ShowUserEndpoint";

useContainer(Container)

export function buildApplication() {
  const app = createExpressServer({
    cors: true,
    controllers: [
      ShowUserEndpoint
    ],
    middlewares: [],
  })

  app.use(express.json())

  return app
}