# Tilt n' Tell

A party guessing game for the phone browser. Put the phone on your forehead,
your friends describe the word, tilt down if you got it, tilt up to pass.

Plain HTML, CSS and JavaScript. No build step, no server, no dependencies.

## Files

| File         | What it is                                                  |
| ------------ | ----------------------------------------------------------- |
| `index.html` | All screens (home, how to play, permission, game, results). |
| `style.css`  | Styles.                                                     |
| `app.js`     | Game logic, tilt detection, sounds. Tunables at the top.    |
| `words.js`   | **Categories and words. Edit this to change the content.**  |

## Running it

Motion sensors only work on HTTPS pages, so tilt can only be tested on a
real phone through the GitHub Pages URL (or another HTTPS host).

To preview the screens on a computer, open `index.html` or serve the folder
(`python3 -m http.server`). On a desktop the game will say no motion is
detected; Chrome DevTools → More tools → **Sensors** can simulate the phone
orientation to test the game flow.

## Deploying to GitHub Pages

Push to GitHub, then Settings → Pages → Deploy from branch → `main` / root.
