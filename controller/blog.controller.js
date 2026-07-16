import cleanupUploadedFiles from '../utils/cleanup.helper.utils.js';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import blogModel from '../model/blog.model.js';
import { deleteFromCloud, uploadToCloud } from '../services/cloudinary.uploader.services.js';

// Helper to parse tags string/array
function parseTags(tagsInput) {
    if (!tagsInput) return [];
    if (Array.isArray(tagsInput)) return tagsInput;
    if (typeof tagsInput === 'string') {
        try {
            const parsed = JSON.parse(tagsInput);
            if (Array.isArray(parsed)) return parsed;
        } catch {}
        return tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    }
    return [];
}

// 1. Get All Blogs (with Pagination, Filtering, Searching, and KPI calculation)
const getAllBlogs = asyncWrapper(async (req, res) => {
    const { status, category, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status) {
        query.status = status;
    }
    if (category) {
        query.category = { $regex: category, $options: 'i' };
    }
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { authorName: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } }
        ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    // Retrieve blogs and total match counts
    const blogs = await blogModel.find(query)
        .sort({ publishDate: -1 })
        .skip(skipNum)
        .limit(limitNum);

    const totalCount = await blogModel.countDocuments(query);

    // KPI Metrics calculation
    const totalBlogs = await blogModel.countDocuments();
    const publishedBlogs = await blogModel.countDocuments({ status: 'published' });
    const draftBlogs = await blogModel.countDocuments({ status: 'draft' });

    res.status(200).json({
        success: true,
        data: blogs,
        meta: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalResults: totalCount,
            kpis: {
                total: totalBlogs,
                published: publishedBlogs,
                draft: draftBlogs
            }
        }
    });
});

// 2. Get Single Blog (by ID or urlSlug)
const getSingleBlog = asyncWrapper(async (req, res) => {
    const { blogId } = req.params;

    // Attempt to search by id first, fallback to slug
    let blog;
    if (blogId.match(/^[0-9a-fA-F]{24}$/)) {
        blog = await blogModel.findById(blogId);
    } else {
        blog = await blogModel.findOne({ urlSlug: blogId.toLowerCase() });
    }

    if (!blog) {
        throw new NOT_FOUND('Blog post not found');
    }

    res.status(200).json({
        success: true,
        data: blog
    });
});

// 3. Create Blog Post
const createBlog = asyncWrapper(async (req, res) => {
    const { title, urlSlug, authorName, publishDate, category, tags, status } = req.body;

    if (!req.file) {
        throw new BAD_REQUEST('Featured image is required');
    }

    // Check if urlSlug is unique
    const existing = await blogModel.findOne({ urlSlug: urlSlug.toLowerCase() });
    if (existing) {
        cleanupUploadedFiles(req);
        throw new BAD_REQUEST('URL Slug is already in use. Please choose a unique slug.');
    }

    let cloudResult;
    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        cleanupUploadedFiles(req);
        throw err;
    }

    const newBlog = await blogModel.create({
        title,
        urlSlug: urlSlug.toLowerCase(),
        authorName,
        publishDate: publishDate || undefined,
        category,
        tags: parseTags(tags),
        featuredImage: cloudResult,
        status: status || 'draft',
        contentBlocks: [],
        cards: []
    });

    cleanupUploadedFiles(req);

    res.status(201).json({
        success: true,
        message: 'Blog post created successfully',
        data: newBlog
    });
});

// 4. Update Blog Post Metadata
const updateBlog = asyncWrapper(async (req, res) => {
    const { blogId } = req.params;
    const { title, urlSlug, authorName, publishDate, category, tags, status, contentBlocks } = req.body;

    const blog = await blogModel.findById(blogId);
    if (!blog) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Blog post not found');
    }

    if (urlSlug) {
        const existing = await blogModel.findOne({ urlSlug: urlSlug.toLowerCase(), _id: { $ne: blogId } });
        if (existing) {
            cleanupUploadedFiles(req);
            throw new BAD_REQUEST('URL Slug is already in use by another blog post.');
        }
        blog.urlSlug = urlSlug.toLowerCase();
    }

    let newImage = blog.featuredImage;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            cleanupUploadedFiles(req);
            throw err;
        }

        await deleteFromCloud(blog.featuredImage.publicId);
        newImage = cloudResult;
    }

    if (title !== undefined) blog.title = title;
    if (authorName !== undefined) blog.authorName = authorName;
    if (publishDate !== undefined) blog.publishDate = publishDate;
    if (category !== undefined) blog.category = category;
    if (tags !== undefined) blog.tags = parseTags(tags);
    if (status !== undefined) blog.status = status;
    if (contentBlocks !== undefined) {
        blog.contentBlocks = typeof contentBlocks === 'string' ? JSON.parse(contentBlocks) : contentBlocks;
    }
    blog.featuredImage = newImage;

    await blog.save();
    cleanupUploadedFiles(req);

    res.status(200).json({
        success: true,
        message: 'Blog post updated successfully',
        data: blog
    });
});

// 5. Delete Blog Post
const deleteBlog = asyncWrapper(async (req, res) => {
    const { blogId } = req.params;

    const blog = await blogModel.findById(blogId);
    if (!blog) {
        throw new NOT_FOUND('Blog post not found');
    }

    // Delete featured image from Cloudinary
    await deleteFromCloud(blog.featuredImage.publicId);

    // Delete all images inside cards array from Cloudinary
    for (const card of blog.cards) {
        if (card.image?.publicId) {
            await deleteFromCloud(card.image.publicId);
        }
    }

    await blog.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Blog post deleted successfully'
    });
});

// 6. Add Blog Card
const addBlogCard = asyncWrapper(async (req, res) => {
    const { blogId } = req.params;
    const { title, platform, stemSkills, paragraph, example, learningOutcomes, proTips } = req.body;

    const blog = await blogModel.findById(blogId);
    if (!blog) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Blog post not found');
    }

    let cardImage = null;
    if (req.file) {
        try {
            cardImage = await uploadToCloud(req.file.path);
        } catch (err) {
            cleanupUploadedFiles(req);
            throw err;
        }
    }

    const newCard = {
        title,
        platform,
        stemSkills: parseTags(stemSkills),
        paragraph,
        example,
        learningOutcomes,
        proTips,
        image: cardImage
    };

    blog.cards.push(newCard);
    await blog.save();
    cleanupUploadedFiles(req);

    const added = blog.cards[blog.cards.length - 1];

    res.status(201).json({
        success: true,
        message: 'Blog card added successfully',
        data: added
    });
});

// 7. Update Blog Card
const updateBlogCard = asyncWrapper(async (req, res) => {
    const { blogId, cardId } = req.params;
    const { title, platform, stemSkills, paragraph, example, learningOutcomes, proTips } = req.body;

    const blog = await blogModel.findById(blogId);
    if (!blog) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Blog post not found');
    }

    const card = blog.cards.id(cardId);
    if (!card) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Blog card not found');
    }

    let newImage = card.image;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            cleanupUploadedFiles(req);
            throw err;
        }

        if (card.image?.publicId) {
            await deleteFromCloud(card.image.publicId);
        }
        newImage = cloudResult;
    }

    if (title !== undefined) card.title = title;
    if (platform !== undefined) card.platform = platform;
    if (stemSkills !== undefined) card.stemSkills = parseTags(stemSkills);
    if (paragraph !== undefined) card.paragraph = paragraph;
    if (example !== undefined) card.example = example;
    if (learningOutcomes !== undefined) card.learningOutcomes = learningOutcomes;
    if (proTips !== undefined) card.proTips = proTips;
    card.image = newImage;

    await blog.save();
    cleanupUploadedFiles(req);

    res.status(200).json({
        success: true,
        message: 'Blog card updated successfully',
        data: card
    });
});

// 8. Delete Blog Card
const deleteBlogCard = asyncWrapper(async (req, res) => {
    const { blogId, cardId } = req.params;

    const blog = await blogModel.findById(blogId);
    if (!blog) {
        throw new NOT_FOUND('Blog post not found');
    }

    const card = blog.cards.id(cardId);
    if (!card) {
        throw new NOT_FOUND('Blog card not found');
    }

    if (card.image?.publicId) {
        await deleteFromCloud(card.image.publicId);
    }

    blog.cards.pull(cardId);
    await blog.save();

    res.status(200).json({
        success: true,
        message: 'Blog card deleted successfully'
    });
});

export {
    getAllBlogs,
    getSingleBlog,
    createBlog,
    updateBlog,
    deleteBlog,
    addBlogCard,
    updateBlogCard,
    deleteBlogCard
};
