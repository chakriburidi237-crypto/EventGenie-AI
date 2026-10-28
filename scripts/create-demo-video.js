const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = path.resolve(__dirname, '..');
const images = [
  'public/screenshots/my-events-dashboard.png',
  'public/screenshots/smart-budget-planner.png',
  'public/screenshots/vendor-checklist.png',
  'public/screenshots/guest-rsvp-manager.png',
  'public/screenshots/event-details-overview.png'
];

let concatContent = '';
for (const img of images) {
  concatContent += `file '${path.resolve(cwd, img).replace(/\\/g, '/')}'\n`;
  concatContent += `duration 4\n`;
}
// Repeat last image to prevent end truncation in concat demuxer
concatContent += `file '${path.resolve(cwd, images[images.length - 1]).replace(/\\/g, '/')}'\n`;

const concatFile = path.resolve(cwd, 'concat_list.txt');
fs.writeFileSync(concatFile, concatContent, 'utf-8');

const outputPath = path.resolve(cwd, 'public/demo_video.mp4');
const rootOutputPath = path.resolve(cwd, 'demo_video.mp4');

const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p" -c:v libx264 -r 30 -pix_fmt yuv420p "${outputPath}"`;

console.log('Running FFmpeg to generate demo video...');
execSync(ffmpegCmd, { stdio: 'inherit' });

// Also copy to root directory for easy access
fs.copyFileSync(outputPath, rootOutputPath);

if (fs.existsSync(concatFile)) {
  fs.unlinkSync(concatFile);
}

console.log('Successfully created demo_video.mp4 at:');
console.log(' - ' + outputPath);
console.log(' - ' + rootOutputPath);
