node get-frontend.js && \
rm -rf ../build && \
unzip download.zip -d .. && \
rm download.zip && \
mv ../react/build ../build && \
rm -R ../react