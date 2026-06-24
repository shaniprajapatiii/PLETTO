const cloudinary = require("../config/cloudinary");

exports.uploadFile = async (req, res) => {
   try {
      if (!req.file) {
         return res.status(400).json({ success: false, message: "No file provided" });
      }

      const result = await new Promise((resolve, reject) => {
         const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", folder: "pletto" },
            (error, file) => {
               if (error) return reject(error);
               resolve(file);
            },
         );

         stream.end(req.file.buffer);
      });

      res.json({ success: true, file: result });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
