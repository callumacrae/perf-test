<template>
  <div>
    <!-- TODO: this doesn't work for script tags -->
    <div v-html="formData.setupHtml"></div>
    <p>
      <strong>status:</strong>
      {{ status }}
    </p>

    <ul>
      <li v-for="(result, i) in testResults" :key="i">
        <strong>{{ result.name }}:</strong>
        {{
          result.status === 'done' ? formatResult(result.result) : result.status
        }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { nextTick } from 'vue';

type Status = 'running' | 'done';
interface DataType {
  status: Status;
  formData: {
    setupHtml: string;
    setupJs: string;
    testJs: string;
    tests: { name: string; code: string }[];
  };
  testResults: ResultObj[];
}

interface ResultObj {
  name: string;
  status: Status;
  result?: ResultData;
}

interface ResultData {
  totalTime: number;
  runs: number;
  average: number;
}

export default {
  data(): DataType {
    return {
      status: 'running',
      // @ts-ignore
      formData: JSON.parse(this.$route.query.testData),
      testResults: []
    };
  },
  mounted() {
    nextTick(() => this.run());
  },
  methods: {
    run(): void {
      const { testJs, tests } = this.formData;

      let promise = Promise.resolve();

      for (const test of tests) {
        promise = promise.then(() => {
          return new Promise(resolve => {
            const resultObj: ResultObj = { name: test.name, status: 'running' };
            this.testResults.push(resultObj);
            setTimeout(() => {
              resultObj.result = this.runTest(testJs, test.code);
              resultObj.status = 'done';
              resolve();
            });
          });
        });
      }

      promise.then(() => {
        this.status = 'done';
      });
    },
    runTest(setupCode: string, testCode: string): ResultData {
      const runTest = new Function(`
        ${setupCode}

        const startTime = performance.now();

        ${testCode};

        return performance.now() - startTime;
      `);

      let runs = 0;
      let totalTime = 0;
      const MAX_RUNS = 1e6;
      const MAX_TIME = 5e3;

      for (; runs < MAX_RUNS && totalTime < MAX_TIME; runs++) {
        totalTime += runTest();
      }

      return { totalTime, runs, average: totalTime / runs };
    },
    formatResult(result: ResultData): string {
      if (!result || !result.average) {
        return '';
      }
      return Math.round(1e3 / result.average) + ' runs per second';
    }
  }
};
</script>
