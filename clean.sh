#!/bin/bash
set -o errexit
export LC_ALL=C
d=$(dirname -- "$0")
cd -- "$d"
exec rm -Rf out upload_tmp