import { typescript } from 'projen'
import { NodePackageManager, TrailingComma } from 'projen/lib/javascript'
import { ReleaseTrigger } from 'projen/lib/release'

const project = new typescript.TypeScriptProject({
    defaultReleaseBranch: 'master',
    name: 'effect-lambda',
    repository: 'git@github.com:successkrisz/effect-lambda.git',
    projenrcTs: true,
    packageManager: NodePackageManager.PNPM,
    prettier: true,
    eslint: true,

    releaseTrigger: ReleaseTrigger.manual(),
    github: false,

    deps: ['@effect/schema', '@types/aws-lambda'],
    peerDeps: ['effect', '@effect/schema'],

    // packageName: undefined,  /* The "name" in package.json. */
})

project.eslint?.addRules({
    semi: ['error', 'never'],
    quotes: ['error', 'single'],
})

project.prettier?.addOverride({
    files: '*.ts',
    options: {
        singleQuote: true,
        semi: false,
        tabWidth: 4,
        trailingComma: TrailingComma.ALL,
        printWidth: 80,
    },
})

project.tsconfig?.compilerOptions?.lib?.push('DOM')

project.gitignore.exclude('.DS_Store')

project.synth()
