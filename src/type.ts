// Copyright 2015 Bobby Powers. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

import { List, Map, Record, Set } from 'immutable';

import * as xmile from './xmile';

export interface Table {
  x: List<number>;
  y: List<number>;
}

export interface SimSpec {
  start: number;
  stop: number;
  dt: number;
  saveStep?: number;
  method?: string;
  timeUnits?: string;

  toJS(): { [key: string]: any };
}

export interface Series {
  name: string;
  time: Float64Array;
  values: Float64Array;
}

export interface Project {
  name: string;
  simSpec: SimSpec;
  main: Module;

  model(name?: string): Model | undefined;
  getFiles(): List<xmile.File>;
}

export interface Model {
  name: string;
  ident: string;
  valid: boolean;
  modules: Map<string, Module>;
  tables: Map<string, Table>;
  project: Project;
  vars: Map<string, Variable>;
  simSpec?: SimSpec;

  lookup(name: string): Variable | undefined;
}

interface ModelDefProps {
  model: Model | undefined;
  modules: Set<Module>;
}

const modelDefDefaults: ModelDefProps = {
  model: undefined,
  modules: Set<Module>(),
};

export class ModelDef extends Record(modelDefDefaults) {
  constructor(params: ModelDefProps) {
    super(params);
  }

  get<T extends keyof ModelDefProps>(value: T): ModelDefProps[T] {
    return super.get(value);
  }
}

export interface Variable {
  xmile?: xmile.Variable;

  ident?: string;
  eqn?: string;

  ast?: any; // FIXME: this is any to fix circular deps

  model?: Model;

  deps: Set<string>;
  allDeps?: Set<string>;

  isConst(): boolean;
  getDeps(parent: Model, project: Project): Set<string>;
  code(parent: Model, offsets: Map<string, number>): string | undefined;
}

export interface Module extends Variable {
  modelName: string;
  refs: Map<string, Reference>;
  referencedModels(project: Project, all?: Map<string, ModelDef>): Map<string, ModelDef>;
  updateRefs(model: Model): void;
}

export interface Reference extends Variable {
  ptr: string;
}

// FROM lex

// constants, sort of...
export const enum TokenType {
  TOKEN,
  IDENT,
  RESERVED,
  NUMBER,
}

export class SourceLoc {
  constructor(public line: number, public pos: number) {}

  off(n: number): SourceLoc {
    return new SourceLoc(this.line, this.pos + n);
  }
}

export class Token {
  constructor(
    public tok: string,
    public type: TokenType,
    public startLoc: SourceLoc,
    public endLoc: SourceLoc,
  ) {}

  get value(): number {
    if (this.type !== TokenType.NUMBER) {
      throw new Error(`Token.value called for non-number: ${this.type}`);
    }

    return parseFloat(this.tok);
  }
}
