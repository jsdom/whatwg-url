#!/bin/bash
set -o errexit
set -o nounset
set -o pipefail
cd "$(dirname "$0")"

npm run build-live-viewer

mkdir -p ../_site
cp -r ../live-viewer/* ../_site # exclude files starting with . by using /*
