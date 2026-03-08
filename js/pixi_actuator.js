function PixiActuator() {
    this.scoreContainer = document.querySelector(".score-container");
    this.bestContainer = document.querySelector(".best-container");
    this.messageContainer = document.querySelector(".game-message");

    this.score = 0;

    // Mathematics derived from play2048.co SVG Dump:
    // Viewbox: 576, Inner Board: 492
    // Scale: 500px (target) / 492 (board units) = 1.01626
    // Full Asset Width: 576 * 1.01626 = 585.366px
    // Board Padding: 42 * 1.01626 = 42.683px
    this.boardScale = 500 / 492;
    this.fullSize = 576 * this.boardScale; // 585.366px
    this.boardOffset = 42 * this.boardScale; // 42.683px

    this.gridSpacing = 12 * this.boardScale; // ~12.19px
    this.tileSize = 108 * this.boardScale; // ~109.75px
    this.tileBorderRadius = 4;

    this.app = new PIXI.Application({
        view: document.getElementById('game-canvas'),
        width: this.fullSize,
        height: this.fullSize,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 2,
        autoDensity: true,
        antialias: true
    });

    // Performance Optimization: Prevent sub-pixel rendering jitter on moving tiles
    PIXI.settings.ROUND_PIXELS = true;

    // Performance Optimization: Sync GSAP animation ticker precisely with the Pixi render loop
    // This cures the "laggy" feeling reported by the user
    this.app.ticker.stop();
    gsap.ticker.add(() => {
        this.app.ticker.update();
    });

    // Create containers
    this.tileContainer = new PIXI.Container();
    this.app.stage.addChild(this.tileContainer);

    // Store active tile sprites mapped by object reference
    this.tiles = new Map();
}

PixiActuator.prototype.actuate = function (grid, metadata) {
    var self = this;

    window.requestAnimationFrame(function () {
        // 1. Move existing tiles
        grid.cells.forEach(function (column) {
            column.forEach(function (cell) {
                if (cell) {
                    self.updateTilePosition(cell);
                }
            });
        });

        self.updateScore(metadata.score);
        self.updateBestScore(metadata.bestScore);

        if (metadata.terminated) {
            if (metadata.over) {
                self.message(false); // You lose
            } else if (metadata.won) {
                self.message(true); // You win!
            }
        }

    });
};

// Continues the game (both restart and keep playing)
PixiActuator.prototype.continueGame = function () {
    this.clearMessage();
    this.clearContainer();
};

PixiActuator.prototype.clearContainer = function () {
    this.tileContainer.removeChildren();
    this.tiles.clear();
};

PixiActuator.prototype.getPixelPosition = function (pos) {
    // The first slot center is at (54, 54) in 576-unit space.
    // Coordinate Logic: Padding (42) + Gap (12) + Tile/2 (54).
    // So slot 0,0 starts at (42 + 12) = 54.
    return {
        x: this.boardOffset + this.gridSpacing + (pos.x * (this.tileSize + this.gridSpacing)),
        y: this.boardOffset + this.gridSpacing + (pos.y * (this.tileSize + this.gridSpacing))
    };
};

PixiActuator.prototype.getTileColors = function (value) {
    var colors = {
        2: { bg: 0xeee4da, text: 0x776e65 },
        4: { bg: 0xede0c8, text: 0x776e65 },
        8: { bg: 0xf2b179, text: 0xf9f6f2 },
        16: { bg: 0xf59563, text: 0xf9f6f2 },
        32: { bg: 0xf67c5f, text: 0xf9f6f2 },
        64: { bg: 0xf65e3b, text: 0xf9f6f2 },
        128: { bg: 0xedcf72, text: 0xf9f6f2 },
        256: { bg: 0xedcc61, text: 0xf9f6f2 },
        512: { bg: 0xedc850, text: 0xf9f6f2 },
        1024: { bg: 0xedc53f, text: 0xf9f6f2 },
        2048: { bg: 0xedc22e, text: 0xf9f6f2 }
    };
    return colors[value] || { bg: 0x3c3a32, text: 0xf9f6f2 };
};

PixiActuator.prototype.getTileFontSize = function (value) {
    if (value < 100) return 55;
    if (value < 1000) return 45;
    if (value < 10000) return 35;
    return 30;
};

PixiActuator.prototype.adjustColor = function (color, amount) {
    var r = (color >> 16) & 0xFF;
    var g = (color >> 8) & 0xFF;
    var b = color & 0xFF;
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return (r << 16) | (g << 8) | b;
};

PixiActuator.prototype.createTileSprite = function (tile) {
    var container = new PIXI.Container();
    var graphics = new PIXI.Graphics();

    var colors = this.getTileColors(tile.value);

    // Mathematics scaled from 576 SVG viewbox mapping
    var size = this.tileSize; // ~93.75px
    // The modern 3D rounded look has much deeper radii (approx 10px on a 108px tile)
    var radius = size * (10 / 108);

    // Colors
    var baseColor = colors.bg;
    var shadowColor = this.adjustColor(colors.bg, -30); // Darker shadow
    var highlightColor = this.adjustColor(colors.bg, 25); // Top inner highlight
    var shadowOffset = size * (4 / 108); // 4px shadow depth
    var dropShadowOffset = shadowOffset + 2;

    // 1. Drop shadow (black under everything)
    graphics.beginFill(0x000000, 0.15);
    graphics.drawRoundedRect(0, dropShadowOffset, size, size, radius);
    graphics.endFill();

    // 2. Base Tile (The thick shadow rim that matches the tile color but darker)
    graphics.beginFill(shadowColor);
    graphics.drawRoundedRect(0, 0, size, size, radius);
    graphics.endFill();

    // 3. Highlight Layer (Top rim)
    graphics.beginFill(highlightColor);
    graphics.drawRoundedRect(0, 0, size, size - shadowOffset, radius);
    graphics.endFill();

    // 4. Main Body Color Layer (Inset over the rim)
    graphics.beginFill(baseColor);
    graphics.drawRoundedRect(0, 1.5, size, size - shadowOffset - 1.5, radius - 0.5);
    graphics.endFill();

    var text = new PIXI.Text(tile.value.toString(), {
        fontFamily: '"Rubik", "Clear Sans", "Helvetica Neue", Arial, sans-serif',
        fontSize: this.getTileFontSize(tile.value),
        fontWeight: '600', // Matches softer Rubik weight
        fill: colors.text
    });

    text.anchor.set(0.5);

    // Align text perfectly inside the visually recessed bounds
    text.x = size / 2;
    text.y = (size - shadowOffset) / 2;

    container.addChild(graphics);
    container.addChild(text);

    // Set pivot to center for scaling animations
    container.pivot.set(size / 2, size / 2);

    return container;
};

PixiActuator.prototype.addTile = function (tile) {
    var sprite = this.createTileSprite(tile);
    this.tiles.set(tile, sprite);
    this.tileContainer.addChild(sprite);

    var pos = this.getPixelPosition({ x: tile.x, y: tile.y });
    // Adjust position due to center pivot
    sprite.x = pos.x + this.tileSize / 2;
    sprite.y = pos.y + this.tileSize / 2;

    if (tile.mergedFrom) {
        // Pop animation (Q弹) - Scales up significantly then bounces back
        gsap.fromTo(sprite.scale,
            { x: 0.5, y: 0.5 },
            {
                x: 1.35,
                y: 1.35,
                duration: 0.1,
                ease: "power2.out",
                onComplete: () => {
                    gsap.to(sprite.scale, {
                        x: 1,
                        y: 1,
                        duration: 0.15,
                        ease: "back.out(3)" // Highly elastic bounce back to normal size
                    });
                }
            }
        );
        sprite.zIndex = 20;

        // Add merged tiles to let them slide in, then remove
        var self = this;
        tile.mergedFrom.forEach(function (merged) {
            self.updateTilePosition(merged, true); // True means it will be removed after animation
        });
    } else {
        // Appear animation (Q弹) - Springs into existence
        gsap.fromTo(sprite.scale,
            { x: 0, y: 0 },
            {
                x: 1,
                y: 1,
                duration: 0.25,
                ease: "back.out(2.5)", // Strong overshoot and spring back
                delay: 0.05
            }
        );
    }

    // Sort children to respect zIndex (Pixi v7 requires sortableChildren = true on container, we just change order)
    this.tileContainer.children.sort((itemA, itemB) => (itemA.zIndex || 0) - (itemB.zIndex || 0));
};

PixiActuator.prototype.updateTilePosition = function (tile, removeAfter) {
    var sprite = this.tiles.get(tile);

    // If we don't know this tile, it's new
    if (!sprite && !removeAfter) {
        this.addTile(tile);
        return;
    }

    if (!sprite) return; // Ghost tile from mergedFrom that hasn't been drawn yet in edge case

    var targetPos = this.getPixelPosition({ x: tile.x, y: tile.y });
    targetPos.x += this.tileSize / 2;
    targetPos.y += this.tileSize / 2;

    if (sprite.x !== targetPos.x || sprite.y !== targetPos.y) {
        gsap.to(sprite, {
            x: targetPos.x,
            y: targetPos.y,
            duration: 0.15, // Increase slightly for Q弹
            ease: "back.out(1.5)", // Extreme elastic over-travel bounce per user request
            onComplete: () => {
                if (removeAfter) {
                    this.tileContainer.removeChild(sprite);
                    sprite.destroy();
                    this.tiles.delete(tile);
                }
            }
        });
    } else if (removeAfter) {
        this.tileContainer.removeChild(sprite);
        sprite.destroy();
        this.tiles.delete(tile);
    }
};

PixiActuator.prototype.updateScore = function (score) {
    this.clearContainerDOM(this.scoreContainer);

    var difference = score - this.score;
    this.score = score;

    this.scoreContainer.textContent = this.score;

    if (difference > 0) {
        var addition = document.createElement("div");
        addition.classList.add("score-addition");
        addition.textContent = "+" + difference;

        this.scoreContainer.appendChild(addition);
    }
};

PixiActuator.prototype.updateBestScore = function (bestScore) {
    this.bestContainer.textContent = bestScore;
};

PixiActuator.prototype.clearContainerDOM = function (container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
};

PixiActuator.prototype.message = function (won) {
    var type = won ? "game-won" : "game-over";
    var message = won ? "You win!" : "Game over!";

    // Delay the Game Over trigger so the final animations can physically complete
    // User noted 'death logic' issues; official site has a ~300-500ms delay.
    setTimeout(() => {
        this.messageContainer.classList.add(type);
        this.messageContainer.getElementsByTagName("p")[0].textContent = message;
    }, 400);
};

PixiActuator.prototype.clearMessage = function () {
    this.messageContainer.classList.remove("game-won");
    this.messageContainer.classList.remove("game-over");
};
