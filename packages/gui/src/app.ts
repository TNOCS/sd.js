import m from 'mithril';
import * as sd from '../../../lib/sd';
import './styles.css';
// import stella from './assets/teacup.xmile';
// import stella from './assets/hares.xmile';
// import stella from './assets/max function.xmile';
// import stella from './assets/min function.xmile';
import stella from './assets/smooth function.xmile';
// import stella from './assets/array function.xmile';

let output = {} as { [name: string]: number[] };

const Counter = {
  oninit: async () => {
    const response = await fetch(stella);
    if (response.status >= 400) {
      console.error(`fetch(${stella}): status ${response.status}`);
    }
    const body = await response.text();
    const parser = new DOMParser();
    const xml: XMLDocument = parser.parseFromString(body, 'application/xml');
    const [project, err] = sd.stdProject.addXmileFile(xml);
    if (err) {
      throw err;
    }
    // called for the side effect
    if (!project || !project.main) {
      return;
    }
    const sim = new sd.Sim(project, project.main, false);
    const rte = await sim.runToEnd();
    // const csv = await sim.csv();
    // console.log('🚀 ~ file: app.ts ~ line 32 ~ oninit: ~ csv', csv);

    const names = await sim.varNames();
    const data = await sim.series(...names);

    for (const name of names) {
      if (!data.has(name)) {
        continue;
      }
      output[name] = Array.from(data.get(name)!.values);
    }
    // console.log('🚀 ~ file: app.ts ~ line 48 ~ oninit: ~ output');
    // console.log(JSON.stringify(output, null, 2));
    console.log('🚀 ~ file: app.ts ~ line 28 ~ oninit: ~ rte', rte);
    m.redraw();
    // const mdl = sd.newModel(xml);

    // const parser = new DOMParser();
    // const xml: XMLDocument = parser.parseFromString(stella, 'application/xml');

    // const mdl = sd.newModel(xml);
    // let result: any;
    // const [mdl] = await sd.load(stella);
    // if (mdl) {
    //   console.log('🚀 ~ file: app.ts ~ line 17 ~ oninit: ~ mdl', mdl);
    // }
  },
  view: function () {
    const names = Object.keys(output);
    if (names.length === 0) return;
    const table = [] as Array<Array<string | number>>;
    table.push(names);
    const time = output.time || output[names[0]];
    time.forEach((_, i) => {
      const row = Array<string | number>(names.length);
      names.forEach((n) => row.push(output[n][i]));
      table.push(row);
    });

    return m(
      'table',
      table.map((row, i) =>
        m(
          'tr',
          row.map((c) => m(i === 0 ? 'th' : 'td', c)),
        ),
      ),
    );
    return m('pre', JSON.stringify(output, null, 2));
  },
};

m.mount(document.body, Counter);
