export const organizationInvitationEmailStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.7;
    color: rgb(26, 26, 26);
    max-width: 580px;
    margin: 0 auto;
    padding: 0;
    background-color: rgb(245, 245, 245);
  }
  .container {
    background-color: rgb(255, 255, 255);
    margin: 40px auto;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
  .header {
    background-color: rgb(10, 37, 64);
    padding: 40px;
    text-align: center;
  }
  .org-logo {
    max-height: 80px;
    max-width: 240px;
    width: auto;
    margin-bottom: 0;
  }
  .org-name {
    color: rgb(255, 255, 255);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin: 0;
  }
  .content { padding: 40px; }
  .title {
    color: rgb(10, 37, 64);
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 24px 0;
    text-align: center;
  }
  .text {
    color: rgb(74, 74, 74);
    font-size: 16px;
    margin: 0 0 20px 0;
  }
  .custom-message {
    background-color: rgb(249, 250, 251);
    border-left: 4px solid rgb(0, 212, 179);
    padding: 20px 24px;
    margin: 32px 0;
    color: rgb(74, 74, 74);
    font-size: 15px;
    font-style: italic;
  }
  .button-container { text-align: center; margin: 40px 0; }
  .button {
    display: inline-block;
    background-color: rgb(10, 37, 64);
    color: rgb(255, 255, 255) !important;
    padding: 16px 40px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 12px rgba(10, 37, 64, 0.2);
  }
  .divider { height: 1px; background-color: rgb(238, 238, 238); margin: 40px 0; }
  .link-label {
    color: rgb(136, 136, 136);
    font-size: 13px;
    margin: 0 0 12px 0;
    text-align: center;
  }
  .link-box {
    background-color: rgb(249, 250, 251);
    border: 1px solid rgb(238, 238, 238);
    padding: 16px;
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
    word-break: break-all;
    color: rgb(102, 102, 102);
    text-align: center;
  }
`;
