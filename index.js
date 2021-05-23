#!/usr/bin/env node

const { exec } = require("child_process");
const co = require("co");
var prompt = require("prompt");

function execute(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout) => {
            if (err) {
                return reject(err);
            }
            resolve(stdout);
        });
    });
}

function branchNameParser(branch) {
    return branch.replace(/^\s+/, "").replace(/^remotes\//, "").replace(/^origin\//, "");
}

co(function* run() {
        yield execute("git fetch -p");
        const remoteBranches = (yield execute("git branch -r")).split("\n").map(branchNameParser);
        const localBranches = (yield execute("git branch")).split("\n").filter((localBranch) => !localBranch.match(/^\*/)).map(branchNameParser);
        const branchesToBeRemoved = localBranches.filter((localBranch) => !remoteBranches.includes(localBranch));
        if (branchesToBeRemoved.length) {
            prompt.start();
            prompt.message = '';
            prompt.delimiter = '';
            prompt.colors = false;
            const { confirm } = yield prompt.get({
                properties: {

                    // setup the dialog
                    confirm: {
                        // allow yes, no, y, n, YES, NO, Y, N as answer
                        pattern: /^(yes|no|y|n)$/gi,
                        description: `The following branches will be removed:\n\n${branchesToBeRemoved.join("\n")}\n\nConfirm (Y/N)?`,
                        message: 'Type yes/no',
                        required: true
                    }
                }
            });
            if (!["y", "yes"].includes(confirm.toLowerCase())) {
                return;
            }
            yield execute(`git branch -d ${branchesToBeRemoved.join(" ")}`);
            console.log("Done!");
        } else {
            console.log("No branches to be removed");
        }
    })
    .catch((e) => {
        process.exit(1);
    });