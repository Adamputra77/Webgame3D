# AGENTS.md

## Progress

### Done
- TsunamiSimulation physical hill slope: replaced flat terrain with beach (flat sand PlaneGeometry), sloped terrain (custom PlaneGeometry with vertex displacement, 30 segments, t² quad easing, green), brown path strip on slope, plateau (flat grass PlaneGeometry at z=7.25)
- Added `getElevation(z)` function that returns 0 for z<=0, 0.8 for z>=6, and t²*0.8 in between
- Camera Y dynamically set to `pos.y + 1.6 + getElevation(pos.z)` in animate loop
- Arrow 3D Y dynamically set to `2.2 + getElevation(arrowZ)`
- Hill, flag pole, palm trees, boundary posts all use `getElevation` for their Y positions
- All TypeScript compiles cleanly with `npx tsc --noEmit`

### In Progress
- Sound effects for tsunami wave, ambient beach, and alert sirens
- Leaderboard / high score tracking via Firebase Firestore
- Player name entry before game start
- Mobile touch controls for player movement
- Post-game reflection/quiz panel integration
- Water physics refinement (wave shape, collision, flooding animation)

### Backlog
- Difficulty levels (easy/medium/hard)
- Multi-language support (EN/ID)
- Accessibility improvements (color contrast, ARIA labels, screen reader support)
- Performance optimization (LOD, instancing, texture atlasing)
- Victory / game-over screen polish
- Procedural terrain generation for other simulations (Volcano, Flood, Earthquake)
