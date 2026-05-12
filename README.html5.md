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