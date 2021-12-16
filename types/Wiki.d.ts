interface WikiResponse {
    batchcomplete: string
    warnings: {
        main: {
            '*': string
        }
        revisions: {
            '*': string
        }
    }
    query: {
        normalized: {
            from: string
            to: string
        }[]
        pages: {
            [key: number]: {
                pageid: number
                ns: number
                title: string
                revisions: {
                    contentformat: string
                    contentmodel: string
                    '*': string
                }[]
            }
        }
    }
}
