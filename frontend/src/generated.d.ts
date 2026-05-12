declare module "*.mjs" {
    const moduleFactory: (module: unknown) => unknown;
    export default moduleFactory;
}
