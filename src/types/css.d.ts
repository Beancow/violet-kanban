// Declarations for CSS imports so TypeScript and the editor accept importing
// CSS and CSS modules in Next.js components.
declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

declare module '*.module.css' {
    const classes: { readonly [key: string]: string };
    export default classes;
}

declare module '@radix-ui/themes/styles.css';
