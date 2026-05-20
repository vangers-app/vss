# Prerequisites
1. Check out this repository with submodules
2. You should have the Steam version installed (to package data)


# Build for WebAssembly

```
mkdir emscripten
cd emscripten
emcmake cmake -GNinja -DCMAKE_BUILD_TYPE=MinSizeRel ..
ninja -j<n>
```

# Testing

```
cd frontend
yarn
yarn run vite
```

Then open `localhost:5173` in the browser