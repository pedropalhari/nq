# nq

`nq` is a batteries included tool to map JSON!

- **TIP:** for best usage and autocomplete, make sure VSCode is accessible through `code` on your bash.

# Examples

- Installing globally

```bash
npm i -g @palhari/nq
echo '{ "users": [{ "name": "pedro" }, { "name": "palhari" }]}' | nq

# or also
nq <file>
```

- Using `npx`

```bash
echo '{ "users": [{ "name": "pedro" }, { "name": "palhari" }]}' | npx @palhari/nq

# or also
npx @palhari/nq <file>
```

# How to use it

- You invoke `nq` on a JSON of choice.
- A VSCode window appears with a default exported function.
- The function has a parameter, `json`. The parameter has autocomplete from the input JSON.
- Close the VSCode tab, the function runs.

# Options

- `-n`, open in a new VSCode instance
