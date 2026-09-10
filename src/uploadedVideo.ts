function handleUpload(uploadSnippet: any) {
    const alertChannelID = '12345' //Query database

    console.log('🎉 New Video Uploaded!');
    console.log(`Title: ${uploadSnippet.title}`);
    console.log(`URL: https://www.youtube.com/watch?v=${uploadSnippet.resourceId?.videoId}`);
}

export { handleUpload }