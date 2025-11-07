# API Proxy

[![Docker Pulls](https://img.shields.io/docker/pulls/aiql/api-proxy.svg)](https://hub.docker.com/r/aiql/api-proxy)
[![NPM Version](https://img.shields.io/npm/v/%40ai-ql%2Fapi-proxy)](https://www.npmjs.com/package/@ai-ql/api-proxy)
[![LICENSE](https://img.shields.io/github/license/AI-QL/api-proxy)](https://github.com/AI-QL/api-proxy/blob/main/LICENSE)

> The previous Docker image (version 2.0.0 and below) is available at:
[![Docker Pulls](https://img.shields.io/docker/pulls/aiql/openai-proxy-docker.svg)](https://hub.docker.com/r/aiql/openai-proxy-docker) 

This repository offers both Dockerized and local proxy solutions for accessing any API, with specialized support for popular interfaces like the OpenAI API. It enables simplified and streamlined interactions with various LLMs.

With the [Docker image](https://hub.docker.com/r/aiql/api-proxy), you can easily deploy a proxy instance to serve as a gateway between your application and the OpenAI API, reducing the complexity of API interactions and enabling more efficient development.

## Use cases

### 1. Geo-restricted API Access | 地域限制API访问
For users who are restricted from direct access to the OpenAI API, particularly those in countries where OpenAI will be blocking API access starting July 2024.

### 2. CORS Bypass | 跨域限制突破
For users who need to access private APIs that lack Cross-Origin Resource Sharing (CORS) headers, this solution provides a proxy to bypass CORS restrictions and enable seamless API interactions.

### 3. TLS Certificate Validation Bypass | TLS证书验证绕过
Bypass client-side security checks, such as enterprise internal self-signed TLS certificates that cannot directly pass TLS certificate validation in many commonly used libraries.

### 4. Custom Host Header Routing | 自定义Host请求头
Specify different Host headers than the URL itself. For some custom hosts, frontend projects cannot directly modify the Host header, requiring a proxy to separately define the URL and Host header parameters.

## Demo

- #### API demo https://api.aiql.com
- #### UI demo [ChatUI](https://github.com/AI-QL/chat-ui)

### For detailed usage of OpenAI API, please check:
- #### [OpenAI API Reference](https://platform.openai.com/docs/api-reference/introduction) (official docs)
- #### [RESTful OpenAPI](https://api-ui.aiql.com) (provided by AIQL)


## Run remotely via Docker

Execute this command to start the proxy with default settings:

```shell
sudo docker run -d -p 9017:9017 aiql/api-proxy:latest
```

Then, you can access it by ```YOURIP:9017```

> For example, the proxied OpenAI Chat Completion API will be: ```YOURIP:9017/v1/chat/completions```
> 
> It should be the same as ```api.openai.com/v1/chat/completions```

You can change default port and default target by setting `-e` in docker, which means that you can use it for any backend followed by OpenAPI format:

| Parameter | Env Var | Default Value | Description |
| --------- | ------- | ------------- | ----------- |
| port      | PORT    | 9017          | Server port number (valid range: 1-65535) |
| target    | TARGET  | https://api.openai.com | Target URL or API endpoint to connect to |
| host      | HOST    | N/A (Inherited from the target URL) | Host header specifying the domain name |
| secure    | SECURE  | true | Enables security features, such as TLS certificate validation |

## Run locally via NPX

Execute this command to start the proxy with default settings:

```shell
npx @ai-ql/api-proxy
```

To skip installation prompts and specify parameters:

```shell
npx -y @ai-ql/api-proxy --target="https://api.deepinfra.com/v1/openai" --port="9019"
```


## How to dev

Click below to use the GitHub Codespace:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/AI-QL/api-proxy?quickstart=1)

Or fork this repo and create a codespace manually:
1. Wait for env ready in your browser
2. `npm install ci`
3. `npm start`

And then, the codespace will provide a forward port (default 9017) for you to check the running.

If everything is OK, check the docker by:
```
docker build .
```

## Docker Push

If you want to maintaine your own docker image, refer to github [Actions](./.github/workflows/docker-image.yml)

Fork this repo and set `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` in your secrets

Normally, the step should be:

1. [Fork](https://github.com/AI-QL/api-proxy/fork) this repo
2. Settings →  Secrets and variables → Actions → New repository secret

## Docker Compose

### Example 1
You can apply this approach to other APIs, such as Nvidia NIM:
- The proxied Nvidia NIM Completion API will be: `YOURIP:9101/v1/chat/completions`
  > For convenience, a readily available API is provided for those who prefer not to deploy it independently: `https://nvidia.aiql.com/v1/chat/completions`

```DOCKERFILE
services:
  nvidia-proxy:
    image: aiql/api-proxy:latest
    container_name: nvidia-proxy
    environment:
      PORT: "9101"
      TARGET: "https://integrate.api.nvidia.com"
    restart: always
    network_mode: host
```

### Example 2
You can apply this approach with your own domain over HTTPS:
- `YOUREMAILADDR@example.com` will be used to get certification notification from ACME server
- The proxied OpenAI Chat Completion API will be: `api.example.com/v1/chat/completions`
  > `api.example.com` should be replaced by your domain name

```DOCKERFILE
services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443/tcp"
      - "443:443/udp"
    environment:
      ENABLE_HTTP3: "true"
    volumes:
      - conf:/etc/nginx/conf.d
      - vhost:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html
      - certs:/etc/nginx/certs:ro
      - /var/run/docker.sock:/tmp/docker.sock:ro
    restart: always
    network_mode: bridge

  acme-companion:
    image: nginxproxy/acme-companion
    container_name: nginx-proxy-acme
    environment:
      - DEFAULT_EMAIL=YOUREMAILADDR@example.com
    volumes_from:
      - nginx-proxy
    volumes:
      - certs:/etc/nginx/certs:rw
      - acme:/etc/acme.sh
      - /var/run/docker.sock:/var/run/docker.sock:ro
    network_mode: bridge

  api-proxy:
    image: aiql/api-proxy:latest
    container_name: api-proxy
    environment:
      LETSENCRYPT_HOST: api.example.com
      VIRTUAL_HOST: api.example.com
      VIRTUAL_PORT: "9017"
    network_mode: host
    depends_on:
      - "nginx-proxy"

volumes:
  conf:
  vhost:
  html:
  certs:
  acme:
```
