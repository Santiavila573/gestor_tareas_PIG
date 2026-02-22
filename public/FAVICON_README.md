# Favicon Files for GestorTasks AI

## Files Included

- **favicon.svg** - Modern SVG favicon (works in all modern browsers)
- **favicon-32.svg** - Simplified 32x32 version for better visibility at small sizes

## Design Elements

The favicon represents GestorTasks AI with:
- **Purple gradient background** (#7b68ee to #a89aff) - Brand colors
- **Task list with checkmarks** - Represents task management
- **AI neural network pattern** - Subtle tech/AI element
- **Golden sparkle** - Represents AI intelligence and innovation

## Optional: Generate PNG/ICO Files

If you need PNG or ICO files for older browser compatibility, you can convert the SVG files using:

### Online Tools:
- https://realfavicongenerator.net/
- https://favicon.io/

### Command Line (if you have ImageMagick installed):
```bash
# Generate PNG files
magick favicon.svg -resize 16x16 favicon-16.png
magick favicon.svg -resize 32x32 favicon-32.png
magick favicon.svg -resize 180x180 apple-touch-icon.png

# Generate ICO file (contains multiple sizes)
magick favicon-16.png favicon-32.png favicon.ico
```

### Using Node.js (if you have sharp installed):
```bash
npm install sharp sharp-ico
node -e "const sharp = require('sharp'); sharp('favicon.svg').resize(32, 32).toFile('favicon-32.png')"
```

## Browser Support

- **Modern Browsers** (Chrome, Firefox, Safari, Edge): Use favicon.svg directly
- **Older Browsers**: Will fall back to favicon.ico if provided
- **iOS/Apple Devices**: Use apple-touch-icon.png for home screen icons

## Current Implementation

The index.html file is configured to use:
1. SVG favicon (primary, best quality)
2. ICO fallback (for older browsers)
3. Apple touch icon (for iOS devices)
4. Theme color meta tags (for browser UI theming)
