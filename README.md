# deno-backend

This is the replacement for
[node-backend](https://github.com/wangyucode/node-backend)

## pre step 1: install the git hooks

`deno task hook-install`

## pre step 2: start the database

`docker compose up`

## run index

`deno task start`

## run test

`deno task test`

## build docker image

`docker build -t wangyucode/deno-backend:latest .`
