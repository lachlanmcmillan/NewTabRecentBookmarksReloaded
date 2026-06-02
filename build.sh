#/usr/bin/env sh

projectName="NewTabRecentBookmarks"

### Backup
cp ./src/manifest.json ./manifest.json
cp ./src/newtab.html ./newtab.html

### Remove debug code
sed -i '/	<script src="livereload.js"><\/script>/ d' ./src/newtab.html


### Firefox
echo "[Firefox]"

# Modify
node ./preparebuild_firefox.js

# Zip
zipFilename="${projectName}-firefox.xpi"
if [ -f "$zipFilename" ]; then
	rm "$zipFilename"
fi
(cd ./src && zip \
	-x "livereload.js" \
	-r \
	"./../${zipFilename}" \
	./* \
)


### Chrome
echo ""
echo "[Chrome]"

# Modify
node ./preparebuild_chrome.js

# Zip
zipFilename="${projectName}-chrome.zip"
if [ -f "$zipFilename" ]; then
	rm "$zipFilename"
fi
(cd ./src && zip \
	-x "faviconcacher.js" \
	-x "livereload.js" \
	-r \
	"./../${zipFilename}" \
	./* \
)



### Restore
mv ./manifest.json ./src/manifest.json
mv ./newtab.html ./src/newtab.html
