import * as React from 'react';

type HtmlProps = {
  children?: React.ReactNode;
  lang?: string;
};

export function Html(props: HtmlProps): JSX.Element {
  const { children } = props;

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>{'<%= htmlWebpackPlugin.options.title %>'}</title>
      </head>
      <body>
        <div id="root">{children}</div>
        {'<%= htmlWebpackPlugin.tags.bodyTags %>'}
      </body>
    </html>
  );
}
