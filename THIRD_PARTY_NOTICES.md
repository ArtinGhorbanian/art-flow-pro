# Third-party notices

This project depends on third-party software and remotely served font files.
Those materials are not covered by the project-level rights-status notice.

## Direct runtime dependencies

| Package | Verified version | License expression | Source |
| --- | ---: | --- | --- |
| FastAPI | 0.139.2 | MIT | <https://github.com/fastapi/fastapi> |
| Uvicorn | 0.51.0 | BSD-3-Clause | <https://github.com/Kludex/uvicorn> |
| Pydantic | 2.13.4 | MIT | <https://github.com/pydantic/pydantic> |
| HTTPX | 0.28.1 | BSD-3-Clause | <https://github.com/encode/httpx> |
| httpx-socks | 0.11.0 | Apache-2.0 | <https://github.com/romis2012/httpx-socks> |
| Jinja2 | 3.1.6 | BSD-3-Clause | <https://github.com/pallets/jinja> |
| python-dotenv | 1.2.2 | BSD-3-Clause | <https://github.com/theskumar/python-dotenv> |

Transitive runtime versions are pinned in `requirements.lock`. Each package is
governed by the license distributed with that package; this table is a concise
inventory, not a replacement for those license texts.

## Fonts

The interface requests **Fraunces** and **Hanken Grotesk** from Google Fonts at
runtime. Font binaries are not stored in this repository. Google Fonts records
both families under the SIL Open Font License 1.1:

- Fraunces: <https://github.com/google/fonts/blob/main/ofl/fraunces/OFL.txt>
- Hanken Grotesk: <https://github.com/google/fonts/blob/main/ofl/hankengrotesk/OFL.txt>

If the fonts are self-hosted later, their copyright statements and complete OFL
license texts must be distributed with the font files.

## Services

Optional AI features call OpenAI APIs using an operator-supplied credential.
OpenAI is a service provider, not a bundled dependency, sponsor, or endorser of
this project. Operators remain responsible for applicable service terms, data
handling, model availability, and usage charges.

## Local visual assets

The HTML contains an inline SVG icon sprite and a geometric product mark, and
the CSS contains an inline SVG noise texture. No upstream attribution was
present in the supplied workspace. Their provenance must be confirmed by the
project creator before any public redistribution; this unresolved item is a
publication gate.
