import { typescript } from 'projen'
import { NodePackageManager, TrailingComma } from 'projen/lib/javascript'
import { ReleaseTrigger } from 'projen/lib/release'
import { TypedocDocgen } from 'projen/lib/typescript'

const project = new typescript.TypeScriptProject({
    defaultReleaseBranch: 'master',
    name: 'effect-lambda',
    repository: 'git@github.com:successkrisz/effect-lambda.git',
    projenrcTs: true,
    packageManager: NodePackageManager.PNPM,
    minNodeVersion: '20.17.0',
    prettier: true,
    eslint: true,
    vscode: true,

    releaseTrigger: ReleaseTrigger.manual(),
    github: false,
    releaseToNpm: true,
    packageName: 'effect-lambda',

    deps: ['@types/aws-lambda'],
    peerDeps: ['effect', '@effect/schema'],
    devDeps: ['helmet'],
})

new TypedocDocgen(project)

project.vscode?.settings.addSettings({
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
    'editor.formatOnSave': true,
    'editor.codeActionsOnSave': {
        'source.fixAll': 'always',
        'source.organizeImports': 'never',
    },
})

project.vscode?.extensions.addRecommendations(
    'dbaeumer.vscode-eslint',
    'esbenp.prettier-vscode',
)

project.eslint?.addRules({
    semi: ['error', 'never'],
    quotes: ['error', 'single'],
    'import/order': [
        'warn',
        {
            groups: ['builtin', 'external'],
            alphabetize: {
                order: 'asc',
                caseInsensitive: true,
            },
        },
    ],
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

project.package.addField(
    'packageManager',
    'pnpm@9.12.0+sha512.4abf725084d7bcbafbd728bfc7bee61f2f791f977fd87542b3579dcb23504d170d46337945e4c66485cd12d588a0c0e570ed9c477e7ccdd8507cf05f3f92eaca',
)

project.synth()
