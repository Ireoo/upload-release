const core = require("@actions/core");
const { GitHub } = require("@actions/github");
const fs = require("fs");
const path = require("path");
const extName = require("ext-name");

const upload = async (uploadUrl, assetPath, assetContentType) => {
  // Determine content-length for header to upload asset
  const contentLength = filePath => fs.statSync(filePath).size;

  // Setup headers for API call, see Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset for more information
  const headers = {
    "content-type": assetContentType,
    "content-length": contentLength(assetPath)
  };

  // Upload a release asset
  // API Documentation: https://developer.github.com/v3/repos/releases/#upload-a-release-asset
  // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset
  const uploadAssetResponse = await github.repos.uploadReleaseAsset({
    url: uploadUrl,
    headers,
    name: assetName,
    file: fs.readFileSync(assetPath)
  });

  // Get the browser_download_url for the uploaded release asset from the response
  const {
    data: { browser_download_url: browserDownloadUrl }
  } = uploadAssetResponse;

  // Set the output variable for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
  core.setOutput("browser_download_url", browserDownloadUrl);
};

async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env.GITHUB_TOKEN);

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const uploadUrl = core.getInput("upload_url", { required: true });
    const dir = core.getInput("dir", { required: true });
    const exts = JSON.parse(core.getInput("exts", { required: true }));
    // const assetContentType = core.getInput("asset_content_type", {
    //   required: true
    // });

    // const dir = ".";
    // const exts = ["exe", "js", "md", "yml"];

    const files = fs.readdirSync(dir).filter(d => {
      console.log(path.join(dir, d), extName(path.join(dir, d))[0]);
      try {
        let e = exts.indexOf(extName(path.join(dir, d))[0].ext);
        return e > -1;
      } catch (e) {
        return false;
      }
    });
    // console.log(files);
    for (let k in files) {
      console.log(
        path.join(dir, files[k]),
        extName(path.join(dir, files[k]))[0].mime
      );
      upload(uploadUrl, files[k], extName(path.join(dir, files[k]))[0].mime);
    }
    // upload(uploadUrl, )
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;

// run();
