<div align="center">

<img src="https://i.kagchi.my.id/nezuko.png" alt="Logo" width="200px" height="200px" style="border-radius:50%"/>

# @nezuchan/nezly

**A REST Proxy container for the Lavalink REST API.**

[![GitHub](https://img.shields.io/github/license/nezuchan/nezly)](https://github.com/nezuchan/nezly/blob/main/LICENSE)
[![Discord](https://discordapp.com/api/guilds/785715968608567297/embed.png)](https://nezu.my.id)
[![Deploy with Vercel](https://img.shields.io/badge/Vercel-Deploy-blue?style=flat&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/NezuChan/nezly)

</div>

# Features
- Written in TypeScript
- Multiple Lavalink nodes support
- Configure-able response timeout
- Vercel Serverless support
- Use preferred custom node using `x-node-name` headers
- Usage analytics, such as tracks info, requester (if user append x-requester-id). everything were sent to client webhook (if set).
- No hardcoded route, note that basic `/loadtracks`, `/decodetracks`, `/decodetrack` routes are hardcoded for caching stuff

# Usage
- You may uses this for scaling LavaLink track loading not for proxying everything via this module