ARG VARIANT=16@sha256:2ed6bba040f90005db9785927689c0d9a9442ca2cf9a59dc52297d684285c094@sha256:b35e76ba744a975b9a5428b6c3cde1a1cf0be53b246e1e9a4874f87034222b5a@sha256:b35e76ba744a975b9a5428b6c3cde1a1cf0be53b246e1e9a4874f87034222b5a

FROM node:${VARIANT}


ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

COPY flag_initialization /src
WORKDIR /src
RUN yarn install

FROM node:${VARIANT}

ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

COPY . /src
WORKDIR /src

RUN yarn install 

FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}
LABEL maintainer="-"

ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Install packages
RUN apt-get update \
    && apt-get -y install --no-install-recommends \
        apt-utils \
        postgresql-client \
        2>&1 \
    && apt-get -y install \
        zsh \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY --from=0 /src/node_modules ./flag_initialization/node_modules
COPY --from=1 /src/node_modules ./node_modules

ENV PORT 3000

ENV SHELL /bin/zsh

EXPOSE 3000
