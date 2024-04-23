await Bun.$`wget -O tmp/cratesiodump.tar.gz https://static.crates.io/db-dump.tar.gz`.quiet();
await Bun.$`cd tmp && rm -rf cratesiodump && mkdir cratesiodump && tar -xzvf cratesiodump.tar.gz -C cratesiodump && rm cratesiodump.tar.gz`.quiet();
const dir = (await Bun.$`ls -d tmp/cratesiodump/*`.text()).trim();
console.log(dir);
export {};
