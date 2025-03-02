import { db } from './db';

export async function populate() {
  console.log('Checking if database needs population...');

  if (await hasExistingData()) {
    console.log('Database already contains data, skipping population');
  } else {
    console.log('Database is empty, populating with initial data...');

    const defaultGroupId = await db.groups.add({
      name: 'Default',
      pos: 0,
      is_selected: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const workGroupId = await db.groups.add({
      name: 'Work',
      pos: 1,
      is_selected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const personalGroupId = await db.groups.add({
      name: 'Personal',
      pos: 2,
      is_selected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.dials.bulkAdd([
      {
        url: 'github.com',
        title: 'GitHub',
        pos: 1,
        groupId: defaultGroupId,
        thumbSourceType: 'default',
        thumbIndex: 1,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        url: 'facebook.com',
        title: 'Facebook',
        pos: 2,
        groupId: personalGroupId,
        thumbSourceType: 'default',
        thumbIndex: 2,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        url: 'x.com',
        title: 'Twitter',
        pos: 3,
        groupId: personalGroupId,
        thumbSourceType: 'default',
        thumbIndex: 3,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log('Database populated with initial data');
  }
}

// Add a utility function to check if data exists
async function hasExistingData() {
  const groupCount = await db.groups.count();
  return groupCount > 0;
}
