// backend/controllers/classSubjectController.js
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import ClassSubjectMapping from '../models/ClassSubjectMapping.js';

// Har function ke aage "export const" lagayein
export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort('name');
    res.json(classes.map(c => c.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
};

export const createClass = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Valid class name required' });
    }
    const cls = await Class.create({ name: name.trim() });
    res.status(201).json(cls.name);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Class already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to create class' });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort('name');
    res.json(subjects.map(s => s.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Valid subject name required' });
    }
    const sub = await Subject.create({ name: name.trim() });
    res.status(201).json(sub.name);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Subject already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to create subject' });
  }
};

export const getClassSubjectMapping = async (req, res) => {
  try {
    const doc = await ClassSubjectMapping.getOrCreate();
    res.json(doc.mapping);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load mapping' });
  }
};

// ... other imports ...

export const updateClassSubjects = async (req, res) => {
  try {
    const { className } = req.params;
    const { subjects = [] } = req.body;

    const classExists = await Class.exists({ name: className });
    if (!classExists) {
      return res.status(400).json({ message: 'Class does not exist' });
    }

    // Optional: Validate subjects
    if (subjects.length > 0) {
      const validSubjects = await Subject.find({ name: { $in: subjects } }).select('name');
      const validNames = validSubjects.map(s => s.name);
      const invalid = subjects.filter(s => !validNames.includes(s));
      if (invalid.length > 0) {
        return res.status(400).json({ message: `Invalid subjects: ${invalid.join(', ')}` });
      }
    }

    const doc = await ClassSubjectMapping.getOrCreate();
    doc.mapping[className] = subjects;
    
    // 🔥 THIS IS THE KEY FIX FOR MONGOOSE
    doc.markModified('mapping');
    
    await doc.save();

    res.json({ message: 'Subjects updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Failed to update subjects' });
  }
};
// Add these exports in your controller

export const deleteClass = async (req, res) => {
  try {
    const { className } = req.params;

    // Optional: Check if class has students or assignments
    // For now, we'll allow deletion

    await Class.deleteOne({ name: className });

    // Also remove from class-subject mapping
    const mappingDoc = await ClassSubjectMapping.getOrCreate();
    delete mappingDoc.mapping[className];
    await mappingDoc.save();

    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete class' });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { subjectName } = req.params;

    // Optional: Check if subject is assigned to any class
    // For now, we'll allow deletion

    await Subject.deleteOne({ name: subjectName });

    // Remove subject from all class mappings
    const mappingDoc = await ClassSubjectMapping.getOrCreate();
for (const cls in mappingDoc.mapping) {
  mappingDoc.mapping[cls] = mappingDoc.mapping[cls].filter(sub => sub !== subjectName);
}
mappingDoc.markModified('mapping'); // ✅
await mappingDoc.save();

    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete subject' });
  }
};

// Add these exports

export const updateClass = async (req, res) => {
  try {
    const { oldName } = req.params;
    const { newName } = req.body;

    if (!newName || typeof newName !== 'string') {
      return res.status(400).json({ message: 'Valid new class name required' });
    }

    const trimmedNew = newName.trim();
    if (!trimmedNew) {
      return res.status(400).json({ message: 'Class name cannot be empty' });
    }

    // Check if new name already exists
    const exists = await Class.findOne({ name: trimmedNew });
    if (exists && exists.name !== oldName) {
      return res.status(400).json({ message: 'Class name already exists' });
    }

    // Update class name
    const result = await Class.updateOne(
      { name: oldName },
      { name: trimmedNew }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Update mapping key
    const mappingDoc = await ClassSubjectMapping.getOrCreate();
if (mappingDoc.mapping[oldName] !== undefined) {
  mappingDoc.mapping[trimmedNew] = mappingDoc.mapping[oldName];
  delete mappingDoc.mapping[oldName];
  mappingDoc.markModified('mapping'); // ✅
  await mappingDoc.save();
}

    res.json({ message: 'Class updated successfully', name: trimmedNew });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update class' });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { oldName } = req.params;
    const { newName } = req.body;

    if (!newName || typeof newName !== 'string') {
      return res.status(400).json({ message: 'Valid new subject name required' });
    }

    const trimmedNew = newName.trim();
    if (!trimmedNew) {
      return res.status(400).json({ message: 'Subject name cannot be empty' });
    }

    // Check if new name already exists
    const exists = await Subject.findOne({ name: trimmedNew });
    if (exists && exists.name !== oldName) {
      return res.status(400).json({ message: 'Subject name already exists' });
    }

    // Update subject name
    const result = await Subject.updateOne(
      { name: oldName },
      { name: trimmedNew }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Update all class mappings
    const mappingDoc = await ClassSubjectMapping.getOrCreate();
for (const cls in mappingDoc.mapping) {
  mappingDoc.mapping[cls] = mappingDoc.mapping[cls].map(sub =>
    sub === oldName ? trimmedNew : sub
  );
}
mappingDoc.markModified('mapping'); // ✅
await mappingDoc.save();

    res.json({ message: 'Subject updated successfully', name: trimmedNew });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update subject' });
  }
};