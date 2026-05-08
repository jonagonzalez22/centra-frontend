function readPackage(pkg) {
    // Auto-allow building for esbuild so CI doesn't prompt for approve-builds
    if (pkg && pkg.name) {
        if (pkg.name === 'esbuild' || pkg.name.startsWith('@esbuild/')) {
            pkg.pnpm = pkg.pnpm || {};
            pkg.pnpm.allowBuild = true;
        }
    }
    return pkg;
}

module.exports = {
    hooks: { readPackage },
};
