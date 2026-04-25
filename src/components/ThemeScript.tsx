export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('mutualtrack-theme');
              if (theme) {
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(theme);
              } else {
                document.documentElement.classList.add('light');
              }
            } catch (e) {
              document.documentElement.classList.add('light');
            }
          })();
        `,
      }}
    />
  );
}