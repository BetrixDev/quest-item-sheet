type ObjectiveType = 'key' | 'pickup' | 'place' | 'mark' | 'find' | 'collect'

interface Requirements {
    level: number
    quests: Quest[]
}

interface Objective {
    type: ObjectiveType
    target: string
    number: number
    location: number
    id: number
}

interface Quest {
    id: number
    require: Requirements
    giver: number
    turnin: number
    title: string
    locales: {
        en: string
        ru: string
        cs: string
    }
    wiki: string
    exp: number
    unlocks: string[]
    reputation: {
        trader: number
        rep: number
    }[]
    objectives: Objective[]
    gameId: string
}
