import { TLRUCache } from "@thi.ng/cache";
import * as express from "express";
import * as Bundler from "parcel-bundler";

import { Commit } from "../common/api";
import { ctx } from "../common/config";
import { buildRepoTableHTML } from "./build-table";
import { repoCommits } from "./git";

// building the repo commit table takes quite some time
// therefore we cache results with 1h expiry time
// (which is also the default)
const rawCache = new TLRUCache<string, Commit[]>(null, { ttl: 60 * 60 * 1000 });
const htmlCache = new TLRUCache<string, string>(null, { ttl: 60 * 60 * 1000 });

// console.log("parcel:", Object.keys(parcel));
const bundler = new Bundler("index.html", {
    outDir: "./out",
    outFile: "index.html",
    publicUrl: "/out",
});

const app = express();

// route for browser version
// here we simply redirect to the Parcel managed client version
app.get("/", (_, res) => {
    res.redirect("/out/");
});

// route for the client to retrieve the commit log as JSON
app.get("/commits", (_, res) => {
    // retrieve raw commit log from cache or
    // (re)create if missing...
    rawCache.getSet(
        ctx.repo.path,
        async () => [...repoCommits(ctx.repo.path)]
    ).then(
        (commits) => res.type("json").send(commits)
    )
});

// route for server-side rendering
// uses both caches
app.get("/ssr", (_, res) => {
    // retrieve rendered html from cache or
    // (re)create if missing...
    htmlCache.getSet(
        ctx.repo.path,
        async () => buildRepoTableHTML(
            await rawCache.getSet(
                ctx.repo.path,
                async () => [...repoCommits(ctx.repo.path)]
            )
        )
    ).then((doc) => res.send(doc))
});

app.use(express.static("."));
app.use(bundler.middleware());

console.log("starting server @ http://localhost:8080");
app.listen(8080);
