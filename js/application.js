// Wait till the browser is ready to render the game (avoids glitches)
// Wait for web fonts (Rubik) to load before initializing PixiJS Canvas to prevent Arial fallback
window.requestAnimationFrame(function () {
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            new GameManager(4, KeyboardInputManager, PixiActuator, LocalStorageManager);
        });
    } else {
        new GameManager(4, KeyboardInputManager, PixiActuator, LocalStorageManager);
    }
});
