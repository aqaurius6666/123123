job("Build and push Docker") {
    docker {
         beforeBuildScript {
            // Create an env variable BRANCH,
            // use env var to get full branch name,
            // leave only the branch name without the 'refs/heads/' path
            content = """
                export BRANCH=${'$'}(echo ${'$'}JB_SPACE_GIT_BRANCH | cut -d'/' -f 3)
            """
        }
        build {
            labels["vendor"] = "blockchainlab"
        }

        push("blockchainlab.registry.jetbrains.space/p/nft-japan/containers/nft-japan-backend") {
            // Use the BRANCH and JB_SPACE_EXECUTION_NUMBER env vars
            tag = "version-0.\$JB_SPACE_EXECUTION_NUMBER-\$BRANCH"
        }
        build {
            labels["vendor"] = "blockchainlab"
            file = "Dockerfile-latest"
        }
        push("blockchainlab.registry.jetbrains.space/p/nft-japan/containers/nft-japan-server") {
            tag = "version-0.\$JB_SPACE_EXECUTION_NUMBER-\$BRANCH"
        }
    }
}

// job("Build and push Docker file") {
//     container(displayName = "Run publish script", image = "docker") {
//         shellScript {
//             interpreter = "/bin/sh"
//             content = """
//                 docker pull node
//             """
//         }
//     }
// }
