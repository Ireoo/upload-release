const core = require("@actions/core");
const { GitHub } = require("@actions/github");
const fs = require("fs");
const path = require("path");
const extName = require("ext-name");

// Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
const github = new GitHub(process.env.GITHUB_TOKEN);

const upload = async (uploadUrl, assetPath, assetContentType, assetName) => {
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
    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const uploadUrl = core.getInput("upload_url", { required: true });
    const dir = core.getInput("dir", { required: true });
    const exts = JSON.parse(
      core.getInput("exts", { required: true }).toLocaleLowerCase()
    );
    const suffix = core.getInput("suffix") || "";

    const files = fs.readdirSync(dir).filter(d => {
      console.log(path.join(dir, d), extName(path.join(dir, d))[0]);
      try {
        let file_array = d.split(".");
        let ext = file_array.pop();
        let e = exts.indexOf(ext.toLocaleLowerCase());
        // let e = exts.indexOf(
        //   extName(path.join(dir, d))[0].ext.toLocaleLowerCase()
        // );
        return e > -1;
      } catch (e) {
        return false;
      }
    });

    for (let k in files) {
      let file_array = files[k].split(".");
      let ext = file_array.pop();
      let name = file_array.join(".");
      console.log(
        path.join(dir, files[k]),
        extName(path.join(dir, files[k]))[0].mime,
        JSON.stringify(file_array),
        `${name}${suffix}.${ext}`
      );
      upload(
        uploadUrl,
        path.join(dir, files[k]),
        extName(path.join(dir, files[k]))[0].mime,
        `${name}${suffix}.${ext}`
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
