export interface DemoRecord {
  id: string;
  title: string;
  description: string;
  number: number;
  currency: number;
  percentage: number;
  boolean1: boolean;
  boolean2: boolean;
  status: string;
  priority: string;
  category: string;
  tags: string[];
  labels: string[];
  rating: number;
  quality: number;
  date: string;
  createdAt: string;
  dueDate: string;
  assignee: string;
  creator: string;
  email: string;
  link: string;
  phone: string;
  progress: number;
}

const statuses = ['待处理', '进行中', '已完成', '已取消', '暂停'];
const priorities = ['低', '中', '高', '紧急'];
const categories = ['开发', '设计', '测试', '运维', '产品', '市场'];
const tagOptions = ['前端', '后端', '移动端', 'API', 'UI', 'UX', '性能', '安全', '数据库', '缓存'];
const labelOptions = ['bug', 'feature', 'enhancement', 'documentation', 'refactor', 'hotfix'];
const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateTime(date: Date): string {
  return date.toISOString();
}

export function generateDemoData(count: number): DemoRecord[] {
  const records: DemoRecord[] = [];

  for (let i = 1; i <= count; i++) {
    const id = `T-${String(i).padStart(4, '0')}`;
    const taskNum = i;
    const taskType = randomItem(['实现', '优化', '修复', '设计', '测试']);
    const feature = randomItem(['登录功能', '数据库', '界面', '性能', 'API']);

    // 随机日期
    const createdDaysAgo = randomInt(0, 90);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - createdDaysAgo);

    const dueDaysAhead = randomInt(1, 60);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDaysAhead);

    const dateDaysAgo = randomInt(0, 30);
    const dateValue = new Date();
    dateValue.setDate(dateValue.getDate() - dateDaysAgo);

    // 随机标签和标记
    const randomTags = tagOptions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 4) + 1);
    
    const randomLabels = labelOptions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 1);

    records.push({
      id,
      title: `任务 ${taskNum} - ${taskType}${feature}`,
      description: `这是第 ${taskNum} 个任务的详细描述，包含更多信息...`,
      number: randomInt(10, 999),
      currency: randomFloat(100, 10000),
      percentage: randomInt(0, 100),
      boolean1: randomBoolean(),
      boolean2: randomBoolean(),
      status: randomItem(statuses),
      priority: randomItem(priorities),
      category: randomItem(categories),
      tags: randomTags,
      labels: randomLabels,
      rating: randomInt(1, 5),
      quality: randomInt(1, 5),
      date: formatDate(dateValue),
      createdAt: formatDateTime(createdDate),
      dueDate: formatDateTime(dueDate),
      assignee: randomItem(names),
      creator: randomItem(names),
      email: `user${taskNum}@example.com`,
      link: `https://example.com/task/${id}`,
      phone: `138${String(taskNum).padStart(8, '0')}`,
      progress: randomInt(0, 100),
    });
  }

  return records;
}




