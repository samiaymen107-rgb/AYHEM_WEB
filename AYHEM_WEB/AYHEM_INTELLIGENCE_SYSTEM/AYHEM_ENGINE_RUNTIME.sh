#!/bin/bash

echo "AYHEM RUNTIME START"

DATE=$(date +"%Y-%m-%d_%H-%M")

BASE=AYHEM_INTELLIGENCE_SYSTEM/storage/$DATE

mkdir -p $BASE

while read TARGET
do

mkdir -p $BASE/$TARGET

python -m argus <<EOF > $BASE/$TARGET/result.txt

use 5
set target $TARGET
run

use 8
set target $TARGET
run

use 118
set target $TARGET
run

exit

EOF

done < AYHEM_INTELLIGENCE_SYSTEM/targets.db


echo "AYHEM RUNTIME END"
