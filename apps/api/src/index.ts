import "reflect-metadata";
import { createExpressServer, useContainer, type Action } from "routing-controllers";
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
    currentUserChecker: async (action: Action) => {
      const token = action.request.headers['Authorization'];
      //  const authService = Container.get(AuthService);

      return undefined
    },
    authorizationChecker: async (action: Action, roles: string[]) => {
      const token = action.request.headers['Authorization'];

      return false
    }
  })

  app.use(express.json())

  return app
}