// deno-lint-ignore-file no-explicit-any
import Vimeo from "@vimeo/vimeo";
import * as fs from "node:fs";
import { Buffer } from "node:buffer";

const CLIENT_ID = Deno.env.get("CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("CLIENT_SECRET");
const TOKEN = Deno.env.get("TOKEN");
const FILES_DIRECTORY = Deno.env.get("FILES_DIRECTORY") || "./";

const runner = async () => {
  console.log("Starting download...");

  const per_page = 10;
  const total_to_fetch = 1000;

  let page = 1;
  let totalFounded = 0;

  if (!CLIENT_ID || !CLIENT_SECRET || !TOKEN) {
    console.error("Missing Vimeo credentials");

    return;
  }

  const vimeo = new Vimeo.Vimeo(CLIENT_ID, CLIENT_SECRET, TOKEN);

  for (let i = 0; i < total_to_fetch; i += per_page) {
    await new Promise((resolve) => {
      vimeo.request(
        `/me/videos?per_page=${per_page}&page=${page}`,
        async (error: any, body: any) => {
          if (error) {
            console.error("Error fetching videos:", error);
            return;
          }

          if (!body || !body.data) {
            console.error("No videos found");
            return;
          }

          totalFounded += body.data.length;

          if (totalFounded >= total_to_fetch) {
            console.log("All videos fetched");
            return;
          } else if (body.data.length === 0) {
            console.log("No more videos to fetch");
            return;
          }

          console.log(`Downloading videos from page ${page}...`);

          for (const video of body.data) {
            if (fs.existsSync(`${FILES_DIRECTORY}${video.name}.mp4`)) {
              console.log(
                "File already exists:",
                `${FILES_DIRECTORY}${video.name}.mp4`
              );
              continue;
            }

            const downladLink = video.files.find(
              (file: any) => file.quality === "hd"
            );

            if (downladLink) {
              console.log("Downloading video:", video.name);
              console.log(
                "File size in MB:",
                (downladLink.size / 1024 / 1024).toFixed(2)
              );

              const response = await fetch(downladLink.link);
              const blob = await response.blob();

              fs.writeFileSync(
                `${FILES_DIRECTORY}${video.name}.mp4`,
                Buffer.from(await blob.arrayBuffer())
              );

              console.log("File saved:", `${FILES_DIRECTORY}${video.name}.mp4`);
            }
          }

          resolve(true);
        }
      );
    });

    page++;
  }

  console.log("All videos downloaded.");
};

runner();
