Podemos adaptar tu caso a Apps Script haciendo que el script haga 3 cosas: leer cambios de GitHub, enviar ese contexto a la IA que ya usas (vía API) y guardar o enviarte el resumen diario dentro de Google Workspace (por ejemplo, por correo o en un Doc/Sheet/Chat). [benlcollins](https://www.benlcollins.com/apps-script/oauth-github/)

## Diseño del flujo en Apps Script

- Origen de datos: Apps Script consulta el historial de GitHub (commits, PRs, diffs) usando la API REST de GitHub y un token personal, similar a como lo haces hoy pero desde `UrlFetchApp`. [docs.github](https://docs.github.com/en/rest/releases/releases)
- Capa de IA: en lugar de usar directamente la UI de Antigravity, el script llama al endpoint HTTP que expone tu “prompt” (o al modelo que tengas configurado en Antigravity) y le pasa como `prompt` el texto generado con los cambios del día. [github](https://github.com/lbjlaq/Antigravity-Manager/blob/main/README_EN.md)
- Salida: el resumen que devuelve la IA se guarda en un Google Doc, en una fila de Google Sheets o se te manda por correo (o como mensaje en un bot de Google Chat si quieres mantener el mismo patrón de “inbox” que comentabas). [developers.google](https://developers.google.com/apps-script?hl=es-419)

## Componentes concretos en Apps Script

- Módulo GitHub: función que llama a `https://api.github.com/repos/{owner}/{repo}/commits` filtrando por fecha (hoy/ayer) para traer mensajes de commit, autor, archivos tocados, etc. [docs.github](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)
- Módulo de agregación: función que arma un texto tipo “Changelog del día” con lista de commits y una pequeña descripción del working tree, similar a lo que hoy envías a Antigravity.
- Módulo IA: función genérica `callAI(prompt)` que usa `UrlFetchApp.fetch` para hablar con el endpoint de Antigravity o con la API de modelo que tengas configurada (OpenAI/Gemini/etc.), y devuelve el resumen en texto. [stackoverflow](https://stackoverflow.com/questions/72146735/how-to-call-an-external-api-from-google-apps-script)
- Módulo de entrega: función que una vez al día (trigger time-driven en Apps Script) ejecuta todo lo anterior y escribe el resultado donde tú prefieras (Docs, Sheets, Gmail o Chat). [developers.google](https://developers.google.com/apps-script/guides/services/external)

## Cómo se vería el uso diario

- Todos los días a las 18:00 un trigger de Apps Script se ejecuta, consulta GitHub, genera el “prompt” con los cambios del working tree y llama a la IA a través de Antigravity/tu API. [benlcollins](https://www.benlcollins.com/apps-script/oauth-github/)
- Recibes un correo con asunto “Resumen diario de actividades” con un resumen redactado en lenguaje natural y, si quieres, una tabla adjunta de commits y autores, o un mensaje en un espacio de Google Chat donde va quedando tu diario de trabajo. [developers.google](https://developers.google.com/apps-script/reference/gmail)

## Siguientes pasos prácticos

Para concretarlo, habría que definir 3 cosas:

- Qué repositorios/branches quieres incluir y el rango de tiempo (solo hoy, últimos N commits, etc.). [docs.github](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)
- Cómo puedes llamar a tu flujo de Antigravity: ¿tienes ya un endpoint HTTP o tendríamos que hablar directamente con la API del modelo que Antigravity gestiona (por ejemplo, OpenAI/Gemini)? [github](https://github.com/Draculabo/AntigravityManager)
- Dónde quieres ver el resumen final (Doc, Sheet, correo, Chat). [developers.google](https://developers.google.com/apps-script?hl=es-419)

Si me respondes a esos tres puntos, te puedo escribir un esqueleto de código Apps Script de ejemplo (en pseudo o casi listo para pegar) adaptado exactamente a tu caso.
