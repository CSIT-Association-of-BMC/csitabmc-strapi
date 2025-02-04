import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::certificate.certificate",
  ({ strapi }) => ({
    async findOne(ctx) {
      const certificateID = ctx.params.id;
      const populate = ctx.query.populate || {};
      try {
        const result = await strapi.entityService.findMany(
          "api::certificate.certificate",
          {
            filters: { certificateID },
            limit: 1,
            populate,
          }
        );

        if (!result || result.length === 0) {
          return ctx.notFound("Certificate not found");
        }

        // Maintain standard response format
        return this.transformResponse(result[0]);
      } catch (err) {
        ctx.internalServerError("Something went wrong");
      }
    },
  })
);
