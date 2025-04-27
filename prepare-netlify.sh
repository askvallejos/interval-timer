#!/bin/bash

# Script to prepare files for Netlify deployment

# Ensure the sounds directory exists at the root
mkdir -p sounds

# Copy sound files from public to root if they exist
if [ -d "public/sounds" ]; then
  cp -f public/sounds/* sounds/
fi

# Ensure public directory exists
mkdir -p public

# Create _redirects file if it doesn't exist
if [ ! -f "public/_redirects" ]; then
  echo "/* /index.html 200" > public/_redirects
fi

# Ensure netlify.toml exists
if [ ! -f "netlify.toml" ]; then
  cat > netlify.toml << EOF
[[headers]]
  for = "/sounds/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
    Content-Type = "audio/mpeg"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
fi

echo "Files prepared for Netlify deployment!" 