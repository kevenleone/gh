import path from "path";

type Package = {
  version: string;
  name: string;
};

let pkg: Package;

try {
  const entryPoint = process.env._ as string;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { name, version } = require(`${path.join(
    path.dirname(entryPoint),
    "../package.json"
  )}`);
  pkg = { name, version };
} catch (error) {
  pkg = {
    name: "gitray",
    version: "undefined",
  };
}

export default pkg;
