# 2048 Remake

This is a personal fork of [gabrielecirulli/2048](https://github.com/gabrielecirulli/2048), focused on animation tuning and rendering experiments while keeping the classic gameplay.

## Current focus

- Keep gameplay behavior aligned with the original 2048 rules
- Improve visual smoothness and tile movement feel
- Keep game-over timing and merge readability close to the original experience

## Run locally

This project is static HTML/CSS/JS.

1. Open `index.html` directly in a browser, or
2. Serve the folder with any simple static server (recommended for consistent asset loading)

Example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Use on another machine

Clone your fork and run locally:

```bash
git clone https://github.com/williamli20140605/2048.git
cd 2048
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

If you want to keep syncing updates from the original repo, add upstream once:

```bash
git remote add upstream https://github.com/gabrielecirulli/2048.git
git fetch upstream
```

## Upstream

- Original project: https://github.com/gabrielecirulli/2048
- This fork remote now points to: `https://github.com/williamli20140605/2048.git`

## License

Same as upstream: [MIT](LICENSE.txt).
